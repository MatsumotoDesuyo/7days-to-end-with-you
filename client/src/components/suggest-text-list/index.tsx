import React from 'react';
import {
  TableContainer,
  TableHead,
  TableCell,
  Table,
  TableRow,
  TableBody,
} from '@mui/material';
import AnalyseSentense from '../../common/analyse-sentense';

type Props = {
  inputText: string;
};

export default function SuggestTextList(props: Props) {
  const { inputText } = props;
  const suggestTexts = AnalyseSentense(inputText);
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ずらし量</TableCell>
            <TableCell>推測文字</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inputText !== '' &&
            suggestTexts.map((txt, idx) => (
              <TableRow>
                <TableCell>{idx}</TableCell>
                <TableCell>{txt}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
