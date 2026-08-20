-- Migration 012 seeded icon values without the leading "pi " class (e.g. 'pi-cog'
-- instead of 'pi pi-cog'), so they never matched the frontend's icon option list
-- and the dropdown never showed a selection. Fix the known seeded values.
-- Safe to run on every Docker start after the migration marker is stored.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '013_fix_asset_type_icon_format') THEN
        UPDATE asset_types SET icon = 'pi pi-cog' WHERE icon = 'pi-cog';
        UPDATE asset_types SET icon = 'pi pi-sitemap' WHERE icon = 'pi-sitemap';
        UPDATE asset_types SET icon = 'pi pi-bolt' WHERE icon = 'pi-bolt';
        UPDATE asset_types SET icon = 'pi pi-building' WHERE icon = 'pi-building';
        UPDATE asset_types SET icon = 'pi pi-truck' WHERE icon = 'pi-truck';
        UPDATE asset_types SET icon = 'pi pi-wrench' WHERE icon = 'pi-wrench';
        UPDATE asset_types SET icon = 'pi pi-home' WHERE icon = 'pi-home';
        UPDATE asset_types SET icon = 'pi pi-box' WHERE icon = 'pi-box';

        INSERT INTO schema_migrations (version) VALUES ('013_fix_asset_type_icon_format');
    END IF;
END $$;
