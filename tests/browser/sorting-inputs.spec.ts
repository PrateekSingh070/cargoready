import { expect, test } from "@playwright/test";

const sorting = "/course/recognising-dangerous-goods/lessons/sort-the-samples";
const aerosol = "Aerosol spray paint";

test("matches cargo with the keyboard sensor", async ({ page }) => {
  await page.goto(sorting);
  const item = page.getByRole("button", { name: aerosol });
  await item.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByText(`Picked up ${aerosol}.`, { exact: true }),
  ).toBeAttached();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByText("Over Class 2 · Gases.", { exact: true }),
  ).toBeAttached();
  await page.keyboard.press("Space");
  await expect(
    page.getByText("1 of 3 items sorted", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(`${aerosol} belongs in Class 2 · Gases.`, { exact: true }),
  ).toBeVisible();
});

test("matches cargo using the viewport's primary pointer", async ({
  page,
  context,
}, testInfo) => {
  await page.goto(sorting);
  const item = page.getByRole("button", { name: aerosol });
  const bin = page.getByRole("heading", { name: "Class 2 · Gases" });
  await expect(item).toBeVisible();
  await expect(bin).toBeVisible();
  await bin.scrollIntoViewIfNeeded();
  const from = await item.boundingBox();
  const to = await bin.boundingBox();
  if (!from || !to)
    throw new Error("Expected the cargo item and bin to be rendered");
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  if (testInfo.project.name === "mobile-360") {
    const client = await context.newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [start],
    });
    for (let step = 1; step <= 8; step++) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: start.x + ((end.x - start.x) * step) / 8,
            y: start.y + ((end.y - start.y) * step) / 8,
          },
        ],
      });
    }
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await client.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.mouse.up();
  }
  await expect(
    page.getByText("1 of 3 items sorted", { exact: true }),
  ).toBeVisible();
});
