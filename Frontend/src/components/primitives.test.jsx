import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./primitives.jsx";

describe("Button", () => {
  test("renders its label and responds to clicks", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Send money</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Send money" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("is disabled and inert while loading", () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} loading>
        Send money
      </Button>
    );
    const button = screen.getByRole("button", { name: "Send money" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("respects an explicit disabled prop", () => {
    render(<Button disabled>Send money</Button>);
    expect(screen.getByRole("button", { name: "Send money" })).toBeDisabled();
  });
});
