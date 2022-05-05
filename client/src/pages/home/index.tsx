import React, { ChangeEvent } from 'react';
import {
  Button,
  Stack,
  TableContainer,
  TableHead,
  TextField,
  Typography,
  Grid,
  Avatar,
  TableCell,
  Table,
  TableRow,
  TableBody,
} from '@mui/material';
import AnalyseSentense from '../../common/analyse-sentense';

type HomeState = {
  upperText: string;
  analyseTexts: string[];
};

const alphabets: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');

// eslint-disable-next-line react/prefer-stateless-function
export default class Home extends React.Component<{}, HomeState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      upperText: '',
      analyseTexts: [],
    };
  }

  onChangeTextFieldHandle = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const inputStr: string = event.target.value!;
    this.showAnalyzeText(inputStr);
  };

  /**
   * 入力された文字から推測文字列を生成する
   */
  showAnalyzeText = (inputStr: string) => {
    //入力された文字列を半角英数のみにする
    const extractedStr = inputStr.match('[a-zA-Z]*')?.toString() ?? '';
    //文字列を大文字に変換
    const upperStr = extractedStr.toString().toUpperCase();
    //文字列からずらし文字列をすべて取得
    const analyseTexts: string[] = AnalyseSentense(upperStr);
    //表示
    if (upperStr != null) {
      this.setState(() => ({
        upperText: upperStr,
        analyseTexts,
      }));
    }
  };

  render() {
    const { analyseTexts } = this.state;
    const { upperText } = this.state;
    return (
      <Stack justifyContent="center" alignItems="center">
        <Stack maxWidth="md" justifyContent="center">
          <Typography variant="h5" textAlign="center">
            7Days To End With You
            <br />
            解読補助ツール
          </Typography>
          <Grid container xs={12} md={9}>
            {alphabets.map((c) => (
              <Grid item xs={4} md={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Avatar src={`/images/${c}.png`} />}
                  onClick={() => {
                    this.showAnalyzeText(upperText + c.toUpperCase());
                  }}
                  style={{ borderRadius: 0 }}
                >
                  {c.toUpperCase()}
                </Button>
              </Grid>
            ))}
          </Grid>

          <TextField
            value={upperText}
            inputProps={{
              pattern: ['[a-zA-Z]*'],
            }}
            label="ここに単語を入力"
            onChange={(event) => {
              this.onChangeTextFieldHandle(event);
            }}
          />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ずらし量</TableCell>
                  <TableCell>推測文字</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyseTexts.map((txt, idx) => (
                  <TableRow>
                    <TableCell>{idx}</TableCell>
                    <TableCell>{txt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>
    );
  }
}
