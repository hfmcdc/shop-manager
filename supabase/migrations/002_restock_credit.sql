alter table stock_movements add column if not exists idem_key text unique;
alter table payments add column if not exists idem_key text;
create unique index if not exists payments_idem on payments(idem_key, bill_id) where idem_key is not null;

create or replace function restock_product(p_key text, p_product uuid, p_qty numeric, p_unit text, p_note text default null)
returns products language plpgsql as $$
declare p products; f numeric; bq numeric;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'Quantity must be positive'; end if;
  select * into p from products where id = p_product and is_active for update;
  if not found then raise exception 'Product not found'; end if;
  if exists (select 1 from stock_movements where idem_key = p_key) then return p; end if; -- duplicate submit
  select u.factor / pu.factor into f from units u, units pu where u.code = p_unit and pu.code = p.unit and u.dimension = pu.dimension;
  if f is null then raise exception 'Unit % not compatible with %', p_unit, p.unit; end if;
  bq := round(p_qty * f, 3);
  update products set stock = stock + bq, updated_at = now() where id = p.id returning * into p;
  insert into stock_movements(product_id, delta, reason, note, idem_key) values (p.id, bq, 'restock', p_note, p_key);
  return p;
end $$;

-- Applies a payment to a customer's oldest unpaid credit bills first.
create or replace function collect_payment(p_key text, p_customer uuid, p_amount numeric, p_method text)
returns numeric language plpgsql as $$
declare b bills; rem numeric := round(p_amount, 2); due numeric; pay numeric; applied numeric := 0;
begin
  if p_method not in ('cash','upi') then raise exception 'Invalid payment method'; end if;
  if rem is null or rem <= 0 then raise exception 'Amount must be positive'; end if;
  perform 1 from customers where id = p_customer for update;
  if exists (select 1 from payments where idem_key = p_key) then return 0; end if; -- duplicate submit
  if rem > coalesce((select sum(total - paid) from bills where customer_id = p_customer and status = 'active' and method = 'credit'), 0)
    then raise exception 'Amount is more than the balance due'; end if;
  for b in select * from bills where customer_id = p_customer and status = 'active' and method = 'credit' and total > paid order by created_at for update loop
    exit when rem <= 0;
    due := b.total - b.paid; pay := least(due, rem);
    update bills set paid = paid + pay where id = b.id;
    insert into payments(bill_id, amount, method, idem_key) values (b.id, pay, p_method, p_key);
    rem := rem - pay; applied := applied + pay;
  end loop;
  return applied;
end $$;
revoke all on function restock_product, collect_payment from public, anon, authenticated;
