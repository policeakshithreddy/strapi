import { test, expect } from '@playwright/test';
import { resetDatabaseAndImportDataFromPath } from '../../scripts/dts-import';
import { login } from '../../utils/login';
import {
  addDefaultField,
  createContentType,
  deleteContentType,
  verifyFieldPresence,
  waitForReload,
} from '../../utils/content-type-builder';

// all tests are run for single and collection types, because there
// is no difference in creating them
async function main() {
  for (const type of ['collection type', 'single type']) {
    await test.describe(`Content Type Builder | Content-Type | ${type}`, () => {
      test.beforeEach(async ({ page }) => {
        await resetDatabaseAndImportDataFromPath('./e2e/data/with-admin.tar');
        await page.goto('/admin');
        await login({ page });
        await page.getByRole('link', { name: 'Content-Type Builder' }).click();
      });

      test('A user should be able to create a content type using simple fields', async ({
        page,
      }) => {
        await createContentType({ page, type, displayName: `CT ${type}` });

        await addDefaultField({
          page,
          type: 'Text',
          name: 'textField',
          addMore: true,
          contentTypeName: `CT ${type}`,
        });
        await addDefaultField({
          page,
          type: 'Email',
          name: 'emailField',
          addMore: true,
          contentTypeName: `CT ${type}`,
        });
        await addDefaultField({
          page,
          type: 'RichText',
          name: 'richtextField',
          addMore: true,
          contentTypeName: `CT ${type}`,
        });
        await addDefaultField({
          page,
          type: 'Password',
          name: 'passwordField',
          addMore: true,
          contentTypeName: `CT ${type}`,
        });
        await addDefaultField({ page, type: 'Number', name: 'numberField', numberType: 'integer' });

        await page.getByRole('button', { name: 'Save' }).click();
        await waitForReload({ page });

        // Verify the content-type has been created
        await expect(page.getByRole('heading', { name: `CT ${type}` })).toBeVisible();

        // Verify the content-type contains the field(s)
        await verifyFieldPresence({ page, name: 'textField' });
        await verifyFieldPresence({ page, name: 'textField' });
        await verifyFieldPresence({ page, name: 'emailField' });
        await verifyFieldPresence({ page, name: 'richtextField' });
        await verifyFieldPresence({ page, name: 'passwordField' });
        await verifyFieldPresence({ page, name: 'numberField' });

        // Cleanup
        await deleteContentType({ page, displayName: `CT ${type}` });

        // TODO: validate content-type has been deleted
      });

      test('A user should be able to edit a content-type', async ({ page }) => {
        await page.getByRole('button', { name: `Create new ${type}` }).click();
        await page.getByLabel('Display name').fill(`${type} Article`);

        // API IDs should be auto-generated based on the initial display name
        await expect(page.getByLabel('API ID (Singular)')).toHaveValue(
          type === 'single type' ? `single-type-article` : `collection-type-article`
        );
        await expect(page.getByLabel('API ID (Plural)')).toHaveValue(
          type === 'single type' ? `single-type-articles` : `collection-type-articles`
        );

        // API IDs should change when the display name changes
        await page.getByLabel('Display name').fill('Something');
        await expect(page.getByLabel('API ID (Singular)')).toHaveValue('something');
        await expect(page.getByLabel('API ID (Plural)')).toHaveValue('somethings');

        await page.getByRole('button', { name: 'Continue' }).click();

        await addDefaultField({
          page,
          type: 'Text',
          name: 'textField',
        });

        await page.getByRole('button', { name: 'Save' }).click();
        await waitForReload({ page });

        // Edit
        await page.getByRole('button', { name: 'Edit' }).click();
        await page.getByLabel('Display name').fill('Something else');

        // The API IDs should not change when editing a content-type
        await expect(page.getByLabel('API ID (Singular)')).toHaveValue('something');
        await expect(page.getByLabel('API ID (Plural)')).toHaveValue('somethings');

        await page.getByRole('button', { name: 'Finish' }).click();
        await waitForReload({ page });

        // Verify the content-type has been created
        await expect(page.getByRole('heading', { name: `Something else` })).toBeVisible();

        // Cleanup
        await deleteContentType({ page, displayName: `Something else` });
      });
    });
  }
}

main();
