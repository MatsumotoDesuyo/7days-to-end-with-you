import React from 'react';
import {
  TableContainer,
  TableHead,
  TableCell,
  Table,
  TableRow,
  TableBody,
} from '@mui/material';

type Props = {
  wordMeans: WordMean[];
};
export type WordMean = {
  word: string;
  mean: string;
};

export default function SuggestWordList(props: Props) {
  const { wordMeans } = props;
  return (
    <>
      {wordMeans.length !== 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>単語</TableCell>
                <TableCell>意味</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wordMeans.map((wm) => (
                <TableRow>
                  <TableCell>{wm.word}</TableCell>
                  <TableCell>{wm.mean}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
