-- KR TRADERS schema. All access goes through server routes using the service role.
-- RLS is enabled on every table with NO policies => anon/authenticated keys can read/write nothing.
create extension if not exists pgcrypto;

create table units(code text primary key, dimension text not null, factor numeric(18,6) not null); -- factor to base unit
insert into units values
('kg','mass',1),('g','mass',0.001),('l','volume',1),('ml','volume',0.001),
('pcs','count',1),('dozen','count',12),('packet','pack',1),('box','box',1);

create table shop_settings(id int primary key default 1 check(id=1), name text not null default 'KR TRADERS',
 phone text not null default '9447431379', address text not null default 'Near Kadavoor Church, Thevally, Kollam',
 receipt_width_mm int not null default 80 check(receipt_width_mm in (58,80)), thank_you text not null default 'Thank you! Visit again.');
insert into shop_settings default values;

create table products(id uuid primary key default gen_random_uuid(), name text not null, barcode text unique,
 price numeric(12,2) not null check(price>=0), unit text not null references units(code),  -- price is per this (base) unit
 stock numeric(14,3) not null default 0 check(stock>=0),                                   -- DB-level negative-stock guard
 is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index on products(lower(name));

create table customers(id uuid primary key default gen_random_uuid(), name text not null, phone text, created_at timestamptz default now());

create sequence bill_seq;
create table bills(id uuid primary key default gen_random_uuid(), bill_no text unique not null,
 idempotency_key text unique not null, customer_id uuid references customers(id),
 total numeric(12,2) not null default 0, paid numeric(12,2) not null default 0 check(paid>=0),
 method text not null check(method in('cash','upi','credit')),
 status text not null default 'active' check(status in('active','cancelled')),
 created_at timestamptz not null default now(), cancelled_at timestamptz);
create index on bills(created_at desc);

create table bill_items(id uuid primary key default gen_random_uuid(), bill_id uuid not null references bills(id),
 product_id uuid not null references products(id), name text not null, qty numeric(14,3) not null check(qty>0),
 unit text not null, base_qty numeric(14,3) not null, unit_price numeric(12,2) not null, line_total numeric(12,2) not null);

create table payments(id uuid primary key default gen_random_uuid(), bill_id uuid not null references bills(id),
 amount numeric(12,2) not null check(amount>0), method text not null check(method in('cash','upi')), created_at timestamptz default now());

create table stock_movements(id uuid primary key default gen_random_uuid(), product_id uuid not null references products(id),
 delta numeric(14,3) not null, reason text not null check(reason in('sale','restock','adjust','cancel','edit')),
 bill_id uuid references bills(id), note text, created_at timestamptz default now());

create table bill_audit(id uuid primary key default gen_random_uuid(), bill_id uuid references bills(id), action text not null, detail jsonb, created_at timestamptz default now());

alter table units enable row level security; alter table shop_settings enable row level security;
alter table products enable row level security; alter table customers enable row level security;
alter table bills enable row level security; alter table bill_items enable row level security;
alter table payments enable row level security; alter table stock_movements enable row level security;
alter table bill_audit enable row level security;

-- Atomic, idempotent billing. items: [{product_id, qty, unit}]
create or replace function create_bill(p_key text, p_customer uuid, p_items jsonb, p_method text, p_paid numeric default 0)
returns bills language plpgsql security invoker as $$
declare b bills; it jsonb; p products; f numeric; bq numeric; lt numeric; tot numeric := 0; pay numeric;
begin
  select * into b from bills where idempotency_key = p_key;
  if found then return b; end if;                       -- duplicate submit => same bill
  if jsonb_array_length(p_items) = 0 then raise exception 'Bill has no items'; end if;
  if p_method = 'credit' and p_customer is null then raise exception 'Credit bills need a customer'; end if;
  insert into bills(bill_no, idempotency_key, customer_id, method)
   values('KR-'||to_char(now() at time zone 'Asia/Kolkata','YYMMDD')||'-'||lpad(nextval('bill_seq')::text,5,'0'), p_key, p_customer, p_method)
   returning * into b;
  for it in select * from jsonb_array_elements(p_items) loop
    select * into p from products where id=(it->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'Product not found'; end if;
    select u.factor / pu.factor into f from units u, units pu
      where u.code = it->>'unit' and pu.code = p.unit and u.dimension = pu.dimension;
    if f is null then raise exception 'Unit % not compatible with %', it->>'unit', p.unit; end if;
    bq := round((it->>'qty')::numeric * f, 3);
    if (it->>'qty')::numeric <= 0 then raise exception 'Quantity must be positive'; end if;
    if p.stock < bq then raise exception 'Insufficient stock for %', p.name; end if;
    lt := round(bq * p.price, 2); tot := tot + lt;
    update products set stock = stock - bq, updated_at = now() where id = p.id;
    insert into bill_items(bill_id,product_id,name,qty,unit,base_qty,unit_price,line_total)
      values(b.id,p.id,p.name,(it->>'qty')::numeric,it->>'unit',bq,p.price,lt);
    insert into stock_movements(product_id,delta,reason,bill_id) values(p.id,-bq,'sale',b.id);
  end loop;
  pay := case when p_method='credit' then least(greatest(p_paid,0),tot) else tot end;
  update bills set total=tot, paid=pay where id=b.id returning * into b;
  if pay > 0 then insert into payments(bill_id,amount,method) values(b.id,pay,case when p_method='upi' then 'upi' else 'cash' end); end if;
  insert into bill_audit(bill_id,action,detail) values(b.id,'create',jsonb_build_object('total',tot));
  return b;
end $$;
revoke all on function create_bill from public, anon, authenticated;
