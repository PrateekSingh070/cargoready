import { expect, test } from "@playwright/test";

for (const check of ["quiz", "scenarios"]) {
  test(`React Testing Library verifies the ${check} component`, async ({
    page,
  }) => {
    await page.goto(`/tests/browser/component-fixture.html?check=${check}`);
    await expect(page.locator("#component-result")).toHaveText("Passed");
  });
}
