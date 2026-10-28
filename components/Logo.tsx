export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground shadow-sm"
      >
        K
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-base font-bold tracking-tight">KSCA</span>
        <span className="hidden text-[0.68rem] text-muted-foreground sm:block">전국 청소년 컴퓨터 사이언스 학회</span>
      </span>
    </span>
  );
}
