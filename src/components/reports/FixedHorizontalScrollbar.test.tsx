import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { FixedHorizontalScrollbar } from "@/components/reports/FixedHorizontalScrollbar";

const defineSize = (element: HTMLElement, sizes: { clientWidth: number; scrollWidth: number }) => {
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: sizes.clientWidth,
  });
  Object.defineProperty(element, "scrollWidth", {
    configurable: true,
    value: sizes.scrollWidth,
  });
};

const Harness = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={scrollRef} data-testid="table-scroll">
        <div ref={contentRef} data-testid="table-content" />
      </div>
      <FixedHorizontalScrollbar
        scrollContainerRef={scrollRef}
        contentRef={contentRef}
        refreshKey={refreshKey}
      />
    </>
  );
};

describe("FixedHorizontalScrollbar", () => {
  it("syncs the bottom scrollbar to the table and back", async () => {
    render(<Harness />);

    const tableScroll = screen.getByTestId("table-scroll");
    const bottomScroll = screen.getByLabelText("Scrollbar horizontal tabel");

    defineSize(tableScroll, { clientWidth: 100, scrollWidth: 400 });
    defineSize(bottomScroll, { clientWidth: 100, scrollWidth: 400 });
    fireEvent.resize(window);

    bottomScroll.scrollLeft = 50;
    fireEvent.scroll(bottomScroll);

    await waitFor(() => expect(tableScroll.scrollLeft).toBe(50));

    tableScroll.scrollLeft = 80;
    fireEvent.scroll(tableScroll);

    await waitFor(() => expect(bottomScroll.scrollLeft).toBe(80));
  });

  it("updates spacer width after resize or zoom-like width changes", async () => {
    render(<Harness />);

    const tableScroll = screen.getByTestId("table-scroll");
    const bottomScroll = screen.getByLabelText("Scrollbar horizontal tabel");
    const spacer = bottomScroll.firstElementChild as HTMLElement;

    defineSize(tableScroll, { clientWidth: 100, scrollWidth: 400 });
    defineSize(bottomScroll, { clientWidth: 100, scrollWidth: 400 });
    fireEvent.resize(window);

    await waitFor(() => expect(spacer.style.width).toBe("400px"));

    defineSize(tableScroll, { clientWidth: 100, scrollWidth: 500 });
    fireEvent.resize(window);

    await waitFor(() => expect(spacer.style.width).toBe("500px"));
  });
});
