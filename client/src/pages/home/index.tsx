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
import './index.css';
import BackspaceIcon from '@mui/icons-material/Backspace';
import axios from 'axios';
import AnalyseSentense from '../../common/analyse-sentense';

type HomeState = {
  upperText: string;
  analyseTexts: string[];
  wordMeans: WordMean[];
};
type WordMean = {
  word: string;
  mean: string;
};

const alphabets: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');

// eslint-disable-next-line react/prefer-stateless-function
export default class Home extends React.Component<{}, HomeState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      upperText: '',
      analyseTexts: [],
      wordMeans: [],
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
        wordMeans: [],
      }));
    }
  };

  searchWord = async () => {
    const { upperText } = this.state;
    const { data } = await axios.get('/api/search-word', {
      params: { word: upperText },
    });
    if (data.length === 0) return;
    this.setState(() => ({
      wordMeans: data,
    }));
  };

  render() {
    const { analyseTexts } = this.state;
    const { upperText } = this.state;
    const { wordMeans } = this.state;
    return (
      <Stack justifyContent="center" alignItems="center">
        <Stack maxWidth="md" justifyContent="center" spacing={2}>
          <Typography variant="h5" textAlign="center">
            7 Days to End with You
            <br />
            解読補助ツール
          </Typography>
          <Typography textAlign="center">
            7 Days to End with
            Youで使用されている、シーザー暗号を解読する簡易ツールです。
            <br />
            答えは見たくないけどちょっとヒントが欲しいというときにお使いください。
          </Typography>
          <Grid container columnSpacing={0.5} rowSpacing={0.5}>
            {alphabets.map((c) => (
              <Grid item xs={4} md={1.3333}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={
                    <Avatar variant="square" src={`/images/${c}.png`} />
                  }
                  onClick={() => {
                    this.showAnalyzeText(upperText + c.toUpperCase());
                  }}
                  style={{ borderRadius: 0 }}
                >
                  {c.toUpperCase()}
                </Button>
              </Grid>
            ))}
            <Grid item xs={4} md={1.3333}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  this.showAnalyzeText(
                    upperText.substring(0, upperText.length - 1)
                  );
                }}
                style={{
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: 11.5,
                }}
              >
                <BackspaceIcon color="action" fontSize="small" />
                BackSpace
              </Button>
            </Grid>
          </Grid>
          <Grid container justifyContent="space-around">
            <Grid item xs={8.5} md={9.5}>
              <TextField
                type="email"
                inputMode="email"
                value={upperText}
                InputProps={{
                  className: 'dtwey-font',
                  style: { fontSize: '30px' },
                }}
                label="ここに単語を入力"
                onChange={(event) => {
                  this.onChangeTextFieldHandle(event);
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3} md={2}>
              <Button
                variant="contained"
                style={{ height: '100%' }}
                fullWidth
                onClick={() => {
                  this.searchWord();
                }}
              >
                辞書検索
              </Button>
            </Grid>
          </Grid>
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
