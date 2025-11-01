import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { usePetStore } from "../stores/petStore";

export function DaemonSwitcher() {
    const daemons = useQuery(api.daemons.all);
    const activeDaemonId = usePetStore((s) => s.activeDaemonId);
    const setActiveDaemonId = usePetStore((s) => s.setActiveDaemonId);
    const ensureSeed = useMutation(api.daemons.ensureSeed);

    useEffect(() => {
        if (daemons && daemons.length === 0) {
            ensureSeed().then((ids) => {
                if (Array.isArray(ids) && ids[0]) setActiveDaemonId(ids[0]);
            }).catch(() => { /* ignore */ });
        }
        if (daemons && !activeDaemonId && daemons[0]) {
            setActiveDaemonId(daemons[0]._id);
        }
    }, [daemons, activeDaemonId, ensureSeed, setActiveDaemonId]);

    if (!daemons) {
        return <div>Loading daemons...</div>;
    }

    return (
        <div className="daemon-switcher">
            <h3>Active Daemon</h3>
            <select
                value={activeDaemonId ?? ""}
                onChange={(e) => setActiveDaemonId(e.target.value as Id<"daemons">)}
            >
                <option value="" disabled>
                    Select a daemon
                </option>
                {daemons.map((daemon: Doc<"daemons">) => (
                    <option key={daemon._id} value={daemon._id}>
                        {daemon.name}
                    </option>
                ))}
            </select>
        </div>
    );
}