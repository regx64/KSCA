-- README.md §3.1 describes an upload field for author name(s)
-- ("저자명(본인 + 공동저자 텍스트 입력)") that the "final" schema in §8 omitted
-- (only author_id, the uploader, exists). This column is additive and does
-- not change any README-specified column, type, or constraint.
alter table papers add column authors text not null default '';
