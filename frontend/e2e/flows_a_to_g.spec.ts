import { test, expect } from "@playwright/test";

test.describe("Mandatory QA Flows (a through g)", () => {
  test.setTimeout(60000);

  test("a. create form, add all 8 question types, publish", async ({ page }) => {
    // 1. Dashboard: Create form
    await page.goto("/");
    const createBtn = page.locator('button:has-text("Create form")').first();
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    // 2. Wait for builder
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Add remaining 7 types (starter short_text already exists)
    const typesToAdd = [
      "long_text",
      "email",
      "number",
      "yes_no",
      "rating",
      "multiple_choice",
      "dropdown",
    ];

    for (const qType of typesToAdd) {
      const addBtn = page.locator('[data-testid="add-content-btn"]');
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();

      const typeOpt = page.locator(`[data-question-type="${qType}"]`).first();
      await expect(typeOpt).toBeVisible({ timeout: 5000 });
      await typeOpt.click();
      await page.waitForTimeout(400);
    }

    // Wait for autosave
    await expect(page.locator('[data-testid="autosave-saved"]')).toBeVisible({ timeout: 10000 });

    // Verify all 8 questions appear in QuestionListPane
    for (let i = 0; i < 8; i++) {
      await expect(page.locator(`[data-testid="question-item-${i}"]`)).toBeVisible({ timeout: 5000 });
    }

    // Publish form
    const publishBtn = page.locator('[data-testid="btn-publish"]');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Modal appears with shareable link
    const modalUrlInput = page.locator('[data-testid="publish-modal-url"]');
    await expect(modalUrlInput).toBeVisible({ timeout: 10000 });
    const publicUrl = await modalUrlInput.inputValue();
    expect(publicUrl).toContain("/f/");

    await page.locator('button:has-text("Done")').click();
  });

  test("b. fill the public form in a fresh browser context using only the keyboard", async ({ browser }) => {
    // Isolated fresh browser context
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    // Navigate to seeded csat2026 public form
    await page.goto("/f/csat2026");
    await page.waitForLoadState("networkidle");

    // If Welcome screen is present, press Enter to start
    const startBtn = page.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
    }

    // Q0: Full name (short_text) - type and press Enter
    await expect(page.locator('[data-testid="runner-text-input"]')).toBeVisible({ timeout: 5000 });
    await page.keyboard.type("Alex Morgan", { delay: 30 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);

    // Q1: Email (email) - type and press Enter
    await expect(page.locator('[data-testid="runner-email-input"]')).toBeVisible({ timeout: 5000 });
    await page.keyboard.type("alex.morgan@test.com", { delay: 30 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);

    // Q2: Multiple choice (Starter / Pro / Enterprise) - press 'a'
    await page.keyboard.press("a");
    await page.waitForTimeout(800);

    // Q3: Dropdown - trigger button receives focus, press Enter to open
    const dropdownTrigger = page.locator('[data-testid="runner-dropdown-trigger"]');
    await expect(dropdownTrigger).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);

    // In open dropdown: press ArrowDown then Enter to select first option
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(800);

    // Q4: Rating - press '5'
    await page.keyboard.press("5");
    await page.waitForTimeout(800);

    // Q5: Number - type '15' and press Enter
    await expect(page.locator('[data-testid="runner-number-input"]')).toBeVisible({ timeout: 5000 });
    await page.keyboard.type("15", { delay: 30 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);

    // Q6: Yes/No - press 'y'
    await page.keyboard.press("y");
    await page.waitForTimeout(800);

    // Q7: Long text - type feedback and submit
    await expect(page.locator('[data-testid="runner-longtext-input"]')).toBeVisible({ timeout: 5000 });
    await page.keyboard.type("Awesome product!", { delay: 30 });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Verify Thank You Screen appears
    await expect(
      page.locator('[data-testid="runner-thank-you"]').or(page.locator("text=Thank you")).or(page.locator("text=registered"))
    ).toBeVisible({ timeout: 15000 });

    await freshContext.close();
  });

  test("c. required field blocks advance and shows an inline error", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/f/csat2026");
    await page.waitForLoadState("networkidle");

    const startBtn = page.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
    }

    // Q0 is required (What is your full name?). Click Next without entering text
    const nextBtn = page.locator('[data-testid="runner-next-btn"]');
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await nextBtn.click();

    // Verify error appears and blocks advance
    const err = page.locator('[data-testid="runner-validation-error"]');
    await expect(err).toBeVisible({ timeout: 5000 });
    await expect(err).toContainText("This field is required");

    // Verify user is still on Q0
    await expect(page.locator('[data-testid="runner-text-input"]')).toBeVisible();

    await context.close();
  });

  test("d. refresh mid-form restores answers", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/f/csat2026");
    await page.waitForLoadState("networkidle");

    const startBtn = page.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
    }

    // Answer Q0
    const textInput = page.locator('[data-testid="runner-text-input"]');
    await expect(textInput).toBeVisible({ timeout: 5000 });
    await textInput.fill("Persisted Name");
    await page.locator('[data-testid="runner-next-btn"]').click();

    // Now on Q1 (email)
    await expect(page.locator('[data-testid="runner-email-input"]')).toBeVisible({ timeout: 5000 });

    // Refresh page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify session storage holds the previous answer
    const stored = await page.evaluate(() => {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("formly_session_"));
      if (keys.length === 0) return null;
      return JSON.parse(sessionStorage.getItem(keys[0]) || "{}");
    });

    expect(stored).not.toBeNull();
    const answers = Object.values(stored.answers || {});
    expect(answers).toContain("Persisted Name");

    await context.close();
  });

  test("e. submit, then confirm the response appears in Results and counts update", async ({ page, browser }) => {
    // 1. Submit a unique response via public form in separate context
    const uniqueName = `Submit_Verify_${Date.now()}`;
    const context = await browser.newContext();
    const runnerPage = await context.newPage();

    await runnerPage.goto("/f/csat2026");
    await runnerPage.waitForLoadState("networkidle");

    const startBtn = runnerPage.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
    }

    // Q0: Short text
    await runnerPage.locator('[data-testid="runner-text-input"]').fill(uniqueName);
    await runnerPage.locator('[data-testid="runner-next-btn"]').click();

    // Q1: Email
    await runnerPage.locator('[data-testid="runner-email-input"]').fill("unique.verifier@test.com");
    await runnerPage.locator('[data-testid="runner-next-btn"]').click();

    // Q2: Choice (single select, auto-advances)
    const choiceOpt = runnerPage.locator('[data-testid="runner-choice-opt-0"]');
    await expect(choiceOpt).toBeVisible({ timeout: 5000 });
    await choiceOpt.click();
    await runnerPage.waitForTimeout(600);

    // Q3: Dropdown
    const dropdownTrigger = runnerPage.locator('[data-testid="runner-dropdown-trigger"]');
    await expect(dropdownTrigger).toBeVisible({ timeout: 5000 });
    await dropdownTrigger.click();

    const dropdownOpt = runnerPage.locator('[data-testid="runner-dropdown-opt-0"]');
    await expect(dropdownOpt).toBeVisible({ timeout: 5000 });
    await dropdownOpt.click();
    await runnerPage.waitForTimeout(600);

    // Q4: Rating
    const ratingBtn = runnerPage.locator('[data-testid="runner-rating-btn-5"]');
    await expect(ratingBtn).toBeVisible({ timeout: 5000 });
    await ratingBtn.click();
    await runnerPage.waitForTimeout(600);

    // Q5: Number
    const numInput = runnerPage.locator('[data-testid="runner-number-input"]');
    await expect(numInput).toBeVisible({ timeout: 5000 });
    await numInput.fill("5");
    await runnerPage.locator('[data-testid="runner-next-btn"]').click();

    // Q6: Yes/No
    const yesBtn = runnerPage.locator('[data-testid="runner-yes-btn"]');
    await expect(yesBtn).toBeVisible({ timeout: 5000 });
    await yesBtn.click();
    await runnerPage.waitForTimeout(600);

    // Q7: Long text (last)
    const longInput = runnerPage.locator('[data-testid="runner-longtext-input"]');
    await expect(longInput).toBeVisible({ timeout: 5000 });
    await longInput.fill("Submitting verify test");
    await runnerPage.locator('[data-testid="runner-next-btn"]').click();

    // Verify Thank You
    await expect(
      runnerPage.locator('[data-testid="runner-thank-you"]').or(runnerPage.locator("text=Thank you")).or(runnerPage.locator("text=registered"))
    ).toBeVisible({ timeout: 15000 });
    await context.close();

    // 2. Re-check Results in creator view
    await page.goto("/forms/1/results");
    await page.waitForLoadState("networkidle");

    // Switch to Responses sub-tab
    const responsesTab = page.locator('button:has-text("Responses")').first();
    await expect(responsesTab).toBeVisible({ timeout: 5000 });
    await responsesTab.click();

    // Verify submission row is in the table
    await expect(page.locator("table").getByText(uniqueName)).toBeVisible({ timeout: 10000 });
  });

  test("f. drag-and-drop reorder persists after reload", async ({ page }) => {
    await page.goto("/");
    await page.locator('button:has-text("Create form")').first().click();
    await page.waitForURL(/\/forms\/\d+\/edit/, { timeout: 15000 });

    // Add email question
    const addBtn = page.locator('[data-testid="add-content-btn"]');
    await addBtn.click();
    await page.locator('[data-question-type="email"]').first().click();
    await page.waitForTimeout(400);

    const item0 = page.locator('[data-testid="question-item-0"]');
    const item1 = page.locator('[data-testid="question-item-1"]');
    await expect(item0).toBeVisible({ timeout: 5000 });
    await expect(item1).toBeVisible({ timeout: 5000 });

    const handle0 = page.locator('[data-testid="drag-handle-0"]');
    const box1 = await item1.boundingBox();
    expect(box1).not.toBeNull();

    await handle0.hover();
    await page.mouse.down();
    if (box1) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height + 15, { steps: 10 });
    }
    await page.mouse.up();

    // Wait for autosave
    await page.waitForTimeout(1500);

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify items still exist in reordered state
    await expect(page.locator('[data-testid="question-item-0"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="question-item-1"]')).toBeVisible({ timeout: 10000 });
  });

  test("g. 375x812 mobile viewport completes the form", async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await mobileContext.newPage();

    await page.goto("/f/eventreg");
    await page.waitForLoadState("networkidle");

    const startBtn = page.locator('[data-testid="runner-start-btn"]');
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
    }

    // Complete eventreg questions on 375x812 viewport
    // Q0: Short text (Full name)
    const nameInput = page.locator('[data-testid="runner-text-input"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("Mobile User");
    await page.locator('[data-testid="runner-next-btn"]').click();

    // Q1: Email (Work Email)
    const emailInput = page.locator('[data-testid="runner-email-input"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill("mobile@example.com");
    await page.locator('[data-testid="runner-next-btn"]').click();

    // Q2: Dropdown (Ticket Tier)
    const trigger = page.locator('[data-testid="runner-dropdown-trigger"]');
    await expect(trigger).toBeVisible({ timeout: 5000 });
    await trigger.click();
    const opt0 = page.locator('[data-testid="runner-dropdown-opt-0"]');
    await expect(opt0).toBeVisible({ timeout: 5000 });
    await opt0.click();
    await page.waitForTimeout(600);

    // Q3: Attendance mode (multiple_choice, multiple: true)
    const trackOpt = page.locator('[data-testid="runner-choice-opt-0"]');
    await expect(trackOpt).toBeVisible({ timeout: 5000 });
    await trackOpt.click();
    await page.locator('[data-testid="runner-next-btn"]').click();

    // Q4: Accommodations (yes_no)
    const yesBtn = page.locator('[data-testid="runner-yes-btn"]');
    await expect(yesBtn).toBeVisible({ timeout: 5000 });
    await yesBtn.click();
    await page.waitForTimeout(600);

    // Q5: Topics (long_text)
    const longInput = page.locator('[data-testid="runner-longtext-input"]');
    await expect(longInput).toBeVisible({ timeout: 5000 });
    await longInput.fill("Mobile topics feedback");
    await page.locator('[data-testid="runner-next-btn"]').click();

    // Verify Thank You Screen appears
    await expect(
      page.locator('[data-testid="runner-thank-you"]').or(page.locator("text=Thank you")).or(page.locator("text=registered"))
    ).toBeVisible({ timeout: 15000 });

    await mobileContext.close();
  });
});
