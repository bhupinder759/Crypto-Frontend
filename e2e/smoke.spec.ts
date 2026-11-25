import { expect, test } from "@playwright/test";

test.describe("public pages (no backend)", () => {
  test("landing renders hero and degrades the live chart", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Trade crypto");
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    // Logged-out visitors must stay on the landing page (no 401 redirect).
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/$/);
  });

  test("login page renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("unknown routes show the 404 page", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});

test.describe("protected routes", () => {
  for (const path of ["/dashboard", "/trading/BTC-USD", "/markets", "/admin"]) {
    test(`${path} redirects to login with next=`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
    });
  }
});
