import React, { ChangeEvent } from 'react';
import { Button, Stack, TextField, Typography, Grid, Box } from '@mui/material';
import './index.scss';
import axios from 'axios';
import Footer from '../../components/footer';
import SuggestTextList from '../../components/suggest-text-list';
import SuggestWordList, { WordMean } from '../../components/suggest-word-list';
import ImageKeyboard from '../../components/image-keyboard';

type HomeState = {
  inputText: string;
  wordMeans: WordMean[] | null;
};

export default class Home extends React.Component<{}, HomeState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      inputText: '',
      wordMeans: null,
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
    //表示
    if (upperStr != null) {
      this.setState(() => ({
        inputText: upperStr,
        wordMeans: null,
      }));
    }
  };

  searchWord = async () => {
    const { inputText } = this.state;
    const { data } = await axios.get<WordMean[]>('/api/search-word', {
      params: { word: inputText },
    });
    // if (data.length === 0) return;
    this.setState(() => ({
      wordMeans: data,
    }));
  };

  render() {
    const { inputText } = this.state;
    const { wordMeans } = this.state;
    return (
      <>
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
            <ImageKeyboard
              onInputButtonPushedFunc={(c: string) => {
                this.showAnalyzeText(inputText + c.toUpperCase());
              }}
              onDeleteButtonPushedFunc={() => {
                this.showAnalyzeText(
                  inputText.substring(0, inputText.length - 1)
                );
              }}
            />
            <Grid container justifyContent="space-around">
              <Grid item xs={8.5} md={9.5}>
                <TextField
                  type="email"
                  inputMode="email"
                  value={inputText}
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
            <SuggestWordList wordMeans={wordMeans} />
            <SuggestTextList inputText={inputText} />
            <Box p={3} />
            <Typography variant="h5">注意事項</Typography>
            <Typography>
              これは単純にシーザー暗号を解読するだけのツールです。
              <br />7 Days to End with
              Youでは一部単純なシーザー暗号のみでは解読できない単語が存在します。
              <br />
              また、辞書のデータベースに存在しない単語は辞書検索を行っても見つかりません。
              <br />
              これだけで全てが解読できるものではないので、プレイを補助する目的でご使用ください。
            </Typography>
            <Typography>
              当ゲームをプレイする中で、このゲームは主に英語圏の人をターゲットにしており、日本語の話者はゲーム開発者が意図していないハンデを負うように感じました。
              <br />
              これはそのハンデを無くそうという試みです。
              <br />
              上手く使ってゲームを楽しんでください。
            </Typography>
          </Stack>
        </Stack>
        <Footer />
      </>
    );
  }
}
