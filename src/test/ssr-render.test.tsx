import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Route } from "../routes/index";

describe("SSR rendering of Index", () => {
  it("renders Index component without throwing", () => {
    const Component = Route.options.component;
    if (!Component) throw new Error("Component not found on route");
    const html = renderToString(<Component />);
    expect(html).toContain("The Fresh Pooch");
  });
});
