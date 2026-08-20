-- Adds an icon to each asset type catalog entry.
-- Safe to run on every Docker start after the migration marker is stored.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '012_asset_type_icon') THEN
        ALTER TABLE asset_types ADD COLUMN IF NOT EXISTS icon VARCHAR(100);

        UPDATE asset_types SET icon = 'pi-cog' WHERE code = 'EQUIPMENT' AND (icon IS NULL OR icon = '');
        UPDATE asset_types SET icon = 'pi-sitemap' WHERE code = 'SUBEQUIPMENT' AND (icon IS NULL OR icon = '');
        UPDATE asset_types SET icon = 'pi-bolt' WHERE code = 'COMPONENT' AND (icon IS NULL OR icon = '');
        UPDATE asset_types SET icon = 'pi-building' WHERE code = 'INSTALLATION' AND (icon IS NULL OR icon = '');
        UPDATE asset_types SET icon = 'pi-truck' WHERE code = 'VEHICLE' AND (icon IS NULL OR icon = '');
        UPDATE asset_types SET icon = 'pi-wrench' WHERE code = 'TOOL' AND (icon IS NULL OR icon = '');
        UPDATE asset_types SET icon = 'pi-home' WHERE code = 'FACILITY' AND (icon IS NULL OR icon = '');
        UPDATE asset_types SET icon = 'pi-box' WHERE code = 'OTHER' AND (icon IS NULL OR icon = '');

        INSERT INTO schema_migrations (version) VALUES ('012_asset_type_icon');
    END IF;
END $$;
