import CrmApp from "./CrmApp";
import {createDemo} from "./crm-seed";

export default function Home() {
  return <CrmApp initial={createDemo()} />;
}
