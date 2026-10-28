-- README §9 concept_id 발급 함수 + §10 신고 3건 자동 숨김 트리거
-- README.md 의 SQL 블록을 그대로 옮긴 것이다 (추적성 유지). 수정 사항은 이후 마이그레이션에서 덧붙인다.

create or replace function generate_concept_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year int := extract(year from now());
  next_seq int;
  new_id text;
begin
  insert into paper_counters (year, last_seq)
  values (current_year, 1)
  on conflict (year)
  do update set last_seq = paper_counters.last_seq + 1
  returning last_seq into next_seq;

  new_id := 'KSCA-' || current_year || '-' || lpad(next_seq::text, 6, '0');
  return new_id;
end;
$$;

create or replace function check_report_threshold()
returns trigger
language plpgsql
as $$
declare
  report_count int;
begin
  select count(*) into report_count
  from reports
  where target_type = new.target_type and target_id = new.target_id and status = 'pending';

  if report_count >= 3 then
    case new.target_type
      when 'paper' then
        update papers set status = 'hidden' where id = new.target_id;
      when 'post' then
        update posts set status = 'hidden' where id = new.target_id;
      when 'comment' then
        update comments set status = 'hidden' where id = new.target_id;
      when 'paper_comment' then
        update paper_comments set status = 'hidden' where id = new.target_id;
    end case;
  end if;

  return new;
end;
$$;

create trigger trg_report_threshold
after insert on reports
for each row execute function check_report_threshold();
