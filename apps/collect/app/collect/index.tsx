import { Redirect } from "expo-router";

// Redirect to first wizard step
export default function CollectIndex() {
  return <Redirect href="/collect/consent" />;
}
