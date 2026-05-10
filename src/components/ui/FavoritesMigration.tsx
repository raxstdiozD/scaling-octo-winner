"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export function FavoritesMigration() {
  const [migrating, setMigrating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const migrateFavorites = async () => {
      try {
        const localFavsRaw = localStorage.getItem('lumora-favorites');
        if (!localFavsRaw) return;
        
        const localFavs = JSON.parse(localFavsRaw);
        if (!Array.isArray(localFavs) || localFavs.length === 0) return;

        setMigrating(true);
        console.log("Migrating old local storage favorites to database...", localFavs);

        // We migrate sequentially to avoid hammering the API
        for (const toolId of localFavs) {
          try {
            await axios.post('/api/user/favorites', {
              toolId,
              action: 'add'
            });
          } catch (e) {
            console.error(`Failed to migrate favorite ${toolId}:`, e);
          }
        }

        // Clear local storage after successful migration
        localStorage.removeItem('lumora-favorites');
        console.log("Migration complete!");
        
        // Refresh the page to show the newly migrated favorites
        router.refresh();
      } catch (err) {
        console.error("Migration error:", err);
      } finally {
        setMigrating(false);
      }
    };

    migrateFavorites();
  }, [router]);

  if (!migrating) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-accent-purple/20 border border-accent-purple/30 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest backdrop-blur-md z-50 flex items-center gap-2">
      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Restoring old favorites...
    </div>
  );
}
