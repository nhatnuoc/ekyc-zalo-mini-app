import { Page, Header } from "zmp-ui";
import MRZScanner from "./mrz-scanner";

export default function ScanMrzPage() {
  return (
    <Page className="flex flex-col" title="Nhập thông tin CCCD">
      <Header title="Nhập thông tin CCCD" />
      <MRZScanner />
    </Page>
  );
}
