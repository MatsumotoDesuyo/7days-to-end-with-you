import { useState } from 'react';
import {
  Button,
  Stack,
  TextField,
  Typography,
  Grid,
  Box,
  Link,
  MenuItem,
  Select,
} from '@mui/material';
import './index.css';
import axios from 'axios';
import Footer from '../../components/footer';
import SuggestTextList from '../../components/suggest-text-list';
import SuggestWordList, { WordMean } from '../../components/suggest-word-list';
import ImageKeyboard from '../../components/image-keyboard';
import { LANG_OPTIONS, useI18n } from '../../i18n';
import type { Lang } from '../../i18n';
import { trackLanguageChange, trackSearch } from '../../ga';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [wordMeans, setWordMeans] = useState<WordMean[] | null>(null);
  const { lang, setLang, t } = useI18n();

  /**
   * 入力された文字から推測文字列を生成する
   */
  const showAnalyzeText = (inputStr: string) => {
    //入力された文字列から非英字をすべて除去し、大文字に変換する (#4)
    const upperStr = inputStr.replace(/[^a-zA-Z]/g, '').toUpperCase();
    setInputText(upperStr);
    setWordMeans(null);
  };

  const searchWord = async () => {
    const { data } = await axios.get<WordMean[]>('/api/search-word', {
      params: { word: inputText, lang },
    });
    setWordMeans(data);
    trackSearch(lang);
  };

  return (
    <>
      <Stack justifyContent="center" alignItems="center">
        <Stack maxWidth="md" justifyContent="center" spacing={2}>
          <Stack direction="row" justifyContent="flex-end">
            <Select
              value={lang}
              size="small"
              inputProps={{ 'aria-label': 'language' }}
              onChange={(event) => {
                const next = event.target.value as Lang;
                setLang(next);
                trackLanguageChange(next);
              }}
            >
              {LANG_OPTIONS.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Typography variant="h5" textAlign="center">
            7 Days to End with You
            <br />
            {t('titleLine2')}
          </Typography>
          <Typography textAlign="center">
            {t('description1')}
            <br />
            {t('description2')}
          </Typography>
          <ImageKeyboard
            onInputButtonPushedFunc={(c: string) => {
              showAnalyzeText(inputText + c.toUpperCase());
            }}
            onDeleteButtonPushedFunc={() => {
              showAnalyzeText(inputText.substring(0, inputText.length - 1));
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
                label={t('inputLabel')}
                onChange={(event) => {
                  showAnalyzeText(event.target.value ?? '');
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
                  searchWord();
                }}
              >
                {t('searchButton')}
              </Button>
            </Grid>
          </Grid>
          <SuggestWordList wordMeans={wordMeans} />
          <SuggestTextList inputText={inputText} />
          <Box p={3} />
          <Typography variant="h5">{t('notesTitle')}</Typography>
          <Typography>
            {t('notes1')}
            <br />
            {t('notes2')}
            <br />
            {t('notes3')}
            <br />
            {t('notes4')}
            <br />
            <Link href="/attributions.html">{t('attributionLink')}</Link>
          </Typography>
          <Typography>
            {t('aboutHandicap1')}
            <br />
            {t('aboutHandicap2')}
            <br />
            {t('aboutHandicap3')}
          </Typography>
        </Stack>
      </Stack>
      <Footer />
    </>
  );
}
