import {
  Children,
  cloneElement,
  isValidElement,
  Suspense,
  type ReactElement,
  type ReactNode,
} from 'react';

/** Resolve the real async caller without mounting an async Server Component. */
export const resolvePageSection = async (
  page: ReactElement<{ children: ReactNode }>,
) => {
  const children = Children.toArray(page.props.children);
  const boundary = children.find(
    (child) => isValidElement(child) && child.type === Suspense,
  ) as ReactElement<{
    children: ReactElement<
      Record<string, unknown>,
      (props: Record<string, unknown>) => Promise<ReactElement>
    >;
  }>;
  const section = boundary.props.children;
  const content = await section.type(section.props);

  return cloneElement(
    page,
    undefined,
    children.map((child) =>
      child === boundary ? cloneElement(boundary, undefined, content) : child,
    ),
  );
};
