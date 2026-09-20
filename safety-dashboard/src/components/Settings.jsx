import { useEffect, useState } from "react";

const DEFAULT_SETTINGS = {
  workspaceName: "SafetyOps AI",
  language: "English",
  timezone: "Asia/Kolkata",

  confidence: 75,
  poseDetection: true,
  ppeDetection: true,
  restrictedZoneDetection: true,

  criticalAlerts: true,
  ppeAlerts: true,
  restrictedZoneAlerts: true,
  soundAlerts: false,

  compactLayout: false,
  backendUrl: "http://127.0.0.1:8001",
};

const STORAGE_KEY = "safetyops_settings";

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // ==========================================
  // LOAD SETTINGS FROM BACKEND
  // ==========================================

  useEffect(() => {
    const loadSettings = async () => {
      // Keep the locally configured backend URL, but load system settings
      // from FastAPI so backend values take priority.
      let localSettings = {};
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) localSettings = JSON.parse(stored);
      } catch (error) {
        console.error("Failed to read local settings:", error);
      }

      const backendUrl = localSettings.backendUrl || DEFAULT_SETTINGS.backendUrl;

      try {
        const response = await fetch(`${backendUrl}/settings`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error("Unable to load backend settings");

        const backendSettings = await response.json();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...localSettings,
          ...backendSettings,
          // Backend confidence is 0-1; the slider displays 0-100.
          confidence: Math.round((backendSettings.confidence ?? 0.5) * 100),
          backendUrl,
        });
        setBackendStatus("connected");
      } catch (error) {
        console.error("Failed to load backend settings:", error);
        setSettings({ ...DEFAULT_SETTINGS, ...localSettings, backendUrl });
        setBackendStatus("disconnected");
        setNotice("Could not load settings from backend. Showing locally saved values.");
      }
    };

    loadSettings();
  }, []);

  // ==========================================
  // UPDATE SETTING
  // ==========================================

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSaved(false);
  };

  // ==========================================
  // SAVE SETTINGS TO BACKEND
  // ==========================================

  const toBackendPayload = (currentSettings) => {
    const { backendUrl, ...payload } = currentSettings;
    return {
      ...payload,
      // FastAPI stores confidence as a decimal between 0 and 1.
      confidence: Number(currentSettings.confidence) / 100,
    };
  };

  const saveSettings = async () => {
    setSaving(true);
    setNotice("");

    try {
      const response = await fetch(`${settings.backendUrl}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBackendPayload(settings)),
        signal: AbortSignal.timeout(5000),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to save settings");
      }

      // Keep backend URL locally; all other settings are stored by FastAPI.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setNotice("Settings saved to backend successfully.");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setNotice(`Save failed: ${error.message}. Check that the backend is running.`);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // RESET SETTINGS ON BACKEND
  // ==========================================

  const resetSettings = async () => {
    setSaving(true);
    setNotice("");

    try {
      const resetValues = { ...DEFAULT_SETTINGS };
      const response = await fetch(`${settings.backendUrl}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBackendPayload(resetValues)),
        signal: AbortSignal.timeout(5000),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to reset settings");
      }

      setSettings(resetValues);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetValues));
      setSaved(false);
      setNotice("Settings restored to defaults.");
      setShowResetConfirm(false);
    } catch (error) {
      console.error("Failed to reset settings:", error);
      setNotice(`Reset failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CHECK BACKEND
  // ==========================================

  const checkBackend = async () => {
    setBackendStatus("checking");

    try {
      const response = await fetch(`${settings.backendUrl}/cameras`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      setBackendStatus("connected");
    } catch {
      setBackendStatus("disconnected");
    }
  };

  // ==========================================
  // REUSABLE TOGGLE
  // ==========================================

  const Toggle = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          value ? "bg-green-500" : "bg-gray-700"
        }`}
        aria-pressed={value}
        aria-label={label}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  // ==========================================
  // SECTION CARD
  // ==========================================

  const Section = ({ title, subtitle, children, icon }) => (
    <div className="bg-[#0f1720] border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-lg">
          {icon}
        </div>

        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );

  // ==========================================
  // INPUT STYLE
  // ==========================================

  const inputClass =
    "w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-green-500 transition";

  return (
    <div className="space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-green-400 font-semibold tracking-wider">
            SYSTEM CONFIGURATION
          </p>

          <h2 className="text-2xl font-bold text-white mt-1">
            Settings
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage your workspace, detection and monitoring preferences.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition"
          >
            Reset Defaults
          </button>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition"
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {notice && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          notice.toLowerCase().includes("failed") || notice.toLowerCase().includes("could not")
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-green-500/30 bg-green-500/10 text-green-300"
        }`}>
          {notice}
        </div>
      )}

      {/* GENERAL SETTINGS */}

      <Section
        title="General Preferences"
        subtitle="Configure your workspace"
        icon="⚙️"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs text-gray-400 block mb-2">
              WORKSPACE NAME
            </label>

            <input
              value={settings.workspaceName}
              onChange={(e) =>
                updateSetting("workspaceName", e.target.value)
              }
              className={inputClass}
              placeholder="Workspace name"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">
              LANGUAGE
            </label>

            <select
              value={settings.language}
              onChange={(e) =>
                updateSetting("language", e.target.value)
              }
              className={inputClass}
            >
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">
              TIMEZONE
            </label>

            <select
              value={settings.timezone}
              onChange={(e) =>
                updateSetting("timezone", e.target.value)
              }
              className={inputClass}
            >
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">New York</option>
              <option value="Europe/London">London</option>
            </select>
          </div>
        </div>
      </Section>

      {/* DETECTION SETTINGS */}

      <Section
        title="Detection Settings"
        subtitle="Configure AI safety detection"
        icon="🎯"
      >
        {/* CONFIDENCE */}

        <div className="pb-5 border-b border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm font-medium text-gray-200">
                Detection Confidence Threshold
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Minimum confidence required for detections.
              </p>
            </div>

            <span className="text-green-400 font-bold text-lg">
              {settings.confidence}%
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            value={settings.confidence}
            onChange={(e) =>
              updateSetting("confidence", Number(e.target.value))
            }
            className="w-full accent-green-500 cursor-pointer"
          />

          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>

        <Toggle
          label="PPE Detection"
          description="Detect helmets, vests, gloves and boots."
          value={settings.ppeDetection}
          onChange={(v) => updateSetting("ppeDetection", v)}
        />

        <Toggle
          label="Pose Detection"
          description="Enable worker pose and movement tracking."
          value={settings.poseDetection}
          onChange={(v) => updateSetting("poseDetection", v)}
        />

        <Toggle
          label="Restricted Zone Detection"
          description="Monitor workers entering restricted areas."
          value={settings.restrictedZoneDetection}
          onChange={(v) => updateSetting("restrictedZoneDetection", v)}
        />
      </Section>

      {/* ALERT SETTINGS */}

      <Section
        title="Alert Preferences"
        subtitle="Manage safety notifications"
        icon="🔔"
      >
        <Toggle
          label="Critical Safety Alerts"
          description="Enable alerts for high-severity safety violations."
          value={settings.criticalAlerts}
          onChange={(v) => updateSetting("criticalAlerts", v)}
        />

        <Toggle
          label="PPE Violation Alerts"
          description="Receive alerts for missing PPE equipment."
          value={settings.ppeAlerts}
          onChange={(v) => updateSetting("ppeAlerts", v)}
        />

        <Toggle
          label="Restricted Zone Alerts"
          description="Enable alerts for restricted area breaches."
          value={settings.restrictedZoneAlerts}
          onChange={(v) => updateSetting("restrictedZoneAlerts", v)}
        />

        <Toggle
          label="Sound Alerts"
          description="Enable sound notifications for safety events."
          value={settings.soundAlerts}
          onChange={(v) => updateSetting("soundAlerts", v)}
        />
      </Section>

      {/* APPEARANCE SETTINGS */}

      <Section
        title="Appearance"
        subtitle="Customize dashboard layout"
        icon="🎨"
      >
        <Toggle
          label="Compact Layout"
          description="Use a more compact dashboard spacing."
          value={settings.compactLayout}
          onChange={(v) => updateSetting("compactLayout", v)}
        />

        <p className="text-xs text-gray-500 mt-3">
          The dashboard currently uses a dark theme.
        </p>
      </Section>

      {/* SYSTEM SETTINGS */}

      <Section
        title="System Configuration"
        subtitle="Backend connection and service status"
        icon="🖥️"
      >
        <div>
          <label className="text-xs text-gray-400 block mb-2">
            BACKEND API URL
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={settings.backendUrl}
              onChange={(e) =>
                updateSetting("backendUrl", e.target.value)
              }
              className={inputClass}
              placeholder="http://127.0.0.1:8001"
            />

            <button
              onClick={checkBackend}
              className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm whitespace-nowrap transition"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between bg-[#111827] rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-200 font-medium">
              Backend Status
            </p>

            <p className="text-xs text-gray-500 mt-1">
              {settings.backendUrl}
            </p>
          </div>

          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              backendStatus === "connected"
                ? "bg-green-500/10 text-green-400"
                : backendStatus === "disconnected"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            ●{" "}
            {backendStatus === "connected"
              ? "Connected"
              : backendStatus === "disconnected"
              ? "Disconnected"
              : "Not Tested"}
          </span>
        </div>
      </Section>

      {/* SAVE FOOTER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#0f1720] border border-gray-800 rounded-xl p-5">
        <div>
          <p className="text-sm font-semibold text-white">
            Save your preferences
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Changes are saved to the backend system configuration.
          </p>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition"
        >
          {saving ? "Saving..." : saved ? "✓ Settings Saved" : "Save Settings"}
        </button>
      </div>

      {/* RESET CONFIRMATION MODAL */}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xl mb-4">
              ↺
            </div>

            <h3 className="text-lg font-bold text-white">
              Reset all settings?
            </h3>

            <p className="text-sm text-gray-400 mt-2">
              This will restore all preferences to their default values.
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={resetSettings}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold"
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}