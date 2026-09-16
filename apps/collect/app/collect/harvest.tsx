import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ChoiceGroup, FormScreen, Notice, PrimaryButton, SectionCard, StepHeader, TextField } from "@/components/ui/FormKit";
import { useDatabase } from "@/components/providers/DBProvider";
import { getEnterpriseById } from "@/features/enterprises/enterpriseRepository";
import { getOrCreateActiveProductionCycle, saveProductionObservation } from "@/features/production/productionRepository";
import { getSectorMeta } from "@/features/sectors/catalog";

const paymentStates = ["paid", "deferred", "partial", "rejected"] as const;

function camel(value: string) {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()).replace(/-/g, "");
}

export default function HarvestSaleStep() {
  const db = useDatabase();
  const params = useLocalSearchParams<{ farmerId?: string; farmId?: string; plotId?: string; enterpriseId?: string; sector?: string; dependsOn?: string }>();
  const [label, setLabel] = useState("Enterprise");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [buyer, setBuyer] = useState("");
  const [price, setPrice] = useState("");
  const [quality, setQuality] = useState("");
  const [payment, setPayment] = useState<(typeof paymentStates)[number]>("paid");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.enterpriseId) return;
    void getEnterpriseById(db, params.enterpriseId).then((enterprise) => {
      setLabel(getSectorMeta(enterprise?.sector ?? params.sector ?? "").label);
    });
  }, [db, params.enterpriseId, params.sector]);

  async function save() {
    if (!params.enterpriseId || !quantity.trim() || !buyer.trim()) {
      setError("Quantity and buyer are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const enterprise = await getEnterpriseById(db, params.enterpriseId);
      const sector = enterprise?.sector ?? params.sector ?? "maize";
      const prefix = camel(sector);
      await getOrCreateActiveProductionCycle(db, params.enterpriseId, sector);
      await saveProductionObservation(db, {
        enterpriseId: params.enterpriseId,
        sector,
        schemaId: `${sector}-harvest-v1`,
        schemaVersion: "1.0.0",
        section: "harvest-sale",
        payload: {
          [`${prefix}HarvestQuantity`]: Number(quantity),
          [`${prefix}HarvestUnit`]: unit,
          [`${prefix}HarvestBuyer`]: buyer.trim(),
          [`${prefix}HarvestPriceKes`]: Number(price) || null,
          [`${prefix}HarvestQuality`]: quality.trim(),
          [`${prefix}HarvestPaymentStatus`]: payment,
        },
        dependsOn: params.dependsOn ? [params.dependsOn] : [],
      });
      router.replace({ pathname: "/collect/holdings", params: { farmerId: params.farmerId, farmId: params.farmId, plotId: params.plotId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save harvest");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen footer={<PrimaryButton label="Save harvest or sale" loading={saving} onPress={() => void save()} />}>
      <StepHeader
        eyebrow={label}
        title="Harvest and sale"
        description="Partial harvests, several buyers, deferred payment, and rejected deliveries are all allowed. This does not overwrite earlier lots."
        step={8}
        total={10}
      />
      <SectionCard title="Lot">
        <TextField label="Quantity" required value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
        <TextField label="Unit" value={unit} onChangeText={setUnit} placeholder="kg, litres, bags, birds" />
        <TextField label="Quality notes" value={quality} onChangeText={setQuality} placeholder="Grade, moisture, rejects" />
      </SectionCard>
      <SectionCard title="Buyer and payment">
        <TextField label="Buyer" required value={buyer} onChangeText={setBuyer} />
        <TextField label="Price (KES)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <ChoiceGroup label="Payment" value={payment} options={[...paymentStates]} onChange={(value) => setPayment(value as (typeof paymentStates)[number])} />
      </SectionCard>
      {error ? <Notice title={error} tone="danger" /> : null}
    </FormScreen>
  );
}
