/** Prototype brand mark: map-pin shop icon with "Apna" + accent "Town". The
 * wordmark is a brand name and is not translated; callers supply the
 * accessible name. */
export function BrandLogo() {
  return (
    <span className="flex items-center gap-2 font-display text-h3 font-bold text-text">
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-7.5">
        <path
          className="fill-primary"
          d="M16 30S5 20.5 5 13a11 11 0 0 1 22 0c0 7.5-11 17-11 17z"
        />
        <path className="fill-on-primary" d="M9.5 11.5h13L21 7.5H11z" />
        <path
          className="fill-accent"
          d="M9.5 11.5h13v1.2a3.25 3.25 0 0 1-6.5 0 3.25 3.25 0 0 1-6.5 0z"
        />
        <rect
          className="fill-on-primary"
          x="11.5"
          y="15"
          width="9"
          height="5.5"
          rx="1"
        />
      </svg>
      <span aria-hidden="true">
        Apna<b className="text-primary">Town</b>
      </span>
    </span>
  );
}
