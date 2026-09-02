import {
  TableContainer,
  TableHead,
  TableCell,
  Table,
  TableRow,
  TableBody,
} from '@mui/material';
import { AnalyseSentense } from 'shared';
import { useI18n } from '../../i18n';

type Props = {
  inputText: string;
};

export default function SuggestTextList(props: Props) {
  const { inputText } = props;
  const { t } = useI18n();
  const suggestTexts = AnalyseSentense(inputText);
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('shiftHeader')}</TableCell>
            <TableCell>{t('candidateHeader')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inputText !== '' &&
            suggestTexts.map((txt, idx) => (
              <TableRow key={idx}>
                <TableCell>{idx}</TableCell>
                <TableCell>{txt}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
