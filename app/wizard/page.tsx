import { WizardIndex } from '@/modules/wizard/index';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default async function Wizard() {

  return (
    <WizardIndex />
  );
}