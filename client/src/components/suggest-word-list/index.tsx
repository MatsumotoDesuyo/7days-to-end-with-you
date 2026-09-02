import {
  TableContainer,
  TableHead,
  TableCell,
  Table,
  TableRow,
  TableBody,
  Typography,
} from '@mui/material';

import { useI18n } from '../../i18n';

type Props = {
  wordMeans: WordMean[] | null;
};
export type WordMean = {
  word: string;
  mean: string;
};

export default function SuggestWordList(props: Props) {
  const { wordMeans } = props;
  const { t } = useI18n();
  return (
    <>
      {wordMeans !== null &&
        (wordMeans.length === 0 ? (
          <Typography>{t('notFound')}</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('wordHeader')}</TableCell>
                  <TableCell>{t('meaningHeader')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wordMeans.map((wm) => (
                  <TableRow key={wm.word}>
                    <TableCell>{wm.word}</TableCell>
                    <TableCell>{wm.mean}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ))}
    </>
  );
}
