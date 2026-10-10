import { test, expect } from "@playwright/test";

test("submit → review → batch → confirmation → partial handover preserves zero recycling", async ({
  page,
}) => {
  // Fresh browser context; all dates are explicitly fictional and future relative
  // to the test clock. No AWS account, private data or live collection is used.
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Give your electronics a next step." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Submit a request", exact: true })
    .click();
  const submit = page.getByRole("dialog");
  await submit.getByLabel("Item category").selectOption("Phones");
  await submit.getByLabel("Number of items").fill("3");
  await submit
    .getByLabel("How should the organiser contact you?")
    .fill("Synthetic test contact");
  await submit
    .getByLabel("Item condition / notes")
    .fill("UI workflow regression fixture");
  await submit.getByRole("button", { name: "Submit for review" }).click();
  await page.reload();
  await page
    .getByRole("combobox", { name: "Demo role" })
    .selectOption("organiser");
  await page.getByRole("button", { name: "Manage drive", exact: true }).click();
  const request = page
    .locator("article.request-card")
    .filter({ hasText: "UI workflow regression fixture" });
  const note = request.getByRole("textbox", { name: "Review note for Phones" });
  await note.pressSequentially("Eligible sample", { delay: 10 });
  await expect(note).toHaveValue("Eligible sample");
  await request.getByRole("button", { name: "Accept", exact: true }).click();
  await request.getByRole("button", { name: "Add to batch" }).click();
  await page
    .getByRole("button", { name: "Request partner confirmation" })
    .click();
  await page
    .getByRole("button", { name: "Record simulated confirmation" })
    .click();
  const confirmation = page.getByRole("dialog");
  const now = new Date();
  const istInput = (value: Date) =>
    new Date(value.getTime() + 330 * 60_000).toISOString().slice(0, 16);
  const collection = new Date(now.getTime() + 2 * 24 * 60 * 60_000);
  const handover = new Date(collection.getTime() + 15 * 60_000);
  await confirmation
    .getByLabel("Confirmation received at (IST)")
    .fill(istInput(now));
  await confirmation
    .getByLabel("Collection date & time (IST)")
    .fill(istInput(collection));
  await confirmation
    .getByLabel("Fees and collection terms")
    .fill("No fee · synthetic");
  await confirmation
    .getByLabel("Confirmed handling instructions")
    .fill("Synthetic workflow; no pickup occurs.");
  await confirmation
    .getByRole("checkbox", { name: "Phones", exact: true })
    .check();
  await confirmation
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await request
    .getByRole("button", { name: "Record handover", exact: true })
    .click();
  const received = page.getByRole("dialog");
  await received.getByLabel("Received items").fill("1");
  await received.getByLabel("Measured weight (kg)").fill("0.2");
  await received
    .getByLabel("Recipient / receiving organisation")
    .fill("Synthetic receiving partner");
  await received
    .getByLabel("Handover date & time (IST)")
    .fill(istInput(handover));
  await received.getByRole("button", { name: "Record received items" }).click();
  await expect(request).toContainText("Partial handover");
  await expect(request).toContainText("1 of 3 items handed over");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  const measured = page
    .locator("article.stat")
    .filter({ hasText: "Measured handover" });
  const recycled = page
    .locator("article.stat")
    .filter({ hasText: "Evidenced recycling" });
  await expect(measured).toContainText("0.2 kg");
  await expect(recycled).toContainText("0 kg");
  await page.reload();
  await expect(measured).toContainText("0.2 kg");
  await expect(recycled).toContainText("0 kg");
});
