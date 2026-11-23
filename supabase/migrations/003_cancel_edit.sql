alter table bills add column if not exists replaces_bill_id uuid references bills(id);
alter table bills add column if not exists cancel_reason text;

-- Cancel = keep the bill, mark cancelled, restore stock, write audit. Nothing is deleted.
create or replace function cancel_bill(p_bill uuid, p_reason text) returns bills language plpgsql as $$
declare b bills; i bill_items;
begin
  select * into b from bills where id = p_bill for update;
  if not found then raise exception 'Bill not found'; end if;
  if b.status = 'cancelled' then raise exception 'Bill is already cancelled'; end if;
  for i in select * from bill_items where bill_id = b.id loop
    update products set stock = stock + i.base_qty, updated_at = now() where id = i.product_id;
    insert into stock_movements(product_id, delta, reason, bill_id, note) values (i.product_id, i.base_qty, 'cancel', b.id, p_reason);
  end loop;
  update bills set status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason where id = b.id returning * into b;
  insert into bill_audit(bill_id, action, detail) values (b.id, 'cancel', jsonb_build_object('reason', p_reason, 'total', b.total, 'paid', b.paid));
  return b;
end $$;

-- Edit = cancel old bill + create corrected bill, in ONE transaction (all or nothing).
create or replace function replace_bill(p_old uuid, p_key text, p_customer uuid, p_items jsonb, p_method text, p_paid numeric, p_reason text)
returns bills language plpgsql as $$
declare nb bills;
begin
  select * into nb from bills where idempotency_key = p_key;
  if found then return nb; end if;
  perform cancel_bill(p_old, coalesce(nullif(p_reason, ''), 'Edited'));
  nb := create_bill(p_key, p_customer, p_items, p_method, p_paid);
  update bills set replaces_bill_id = p_old where id = nb.id returning * into nb;
  insert into bill_audit(bill_id, action, detail) values (p_old, 'edited', jsonb_build_object('new_bill', nb.id, 'new_bill_no', nb.bill_no));
  insert into bill_audit(bill_id, action, detail) values (nb.id, 'edit_of', jsonb_build_object('old_bill', p_old));
  return nb;
end $$;
revoke all on function cancel_bill, replace_bill from public, anon, authenticated;
