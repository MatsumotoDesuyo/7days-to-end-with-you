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
import AdUnit from '../../components/ad-unit';
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
      <Stack sx={{ justifyContent: 'center', alignItems: 'center' }}>
        <Stack
          spacing={2}
          sx={{ maxWidth: 'md', justifyContent: 'center' }}
        >
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Select
              value={lang}
              size="small"
              slotProps={{ input: { 'aria-label': 'language' } }}
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
          <Typography variant="h5" sx={{ textAlign: 'center' }}>
            7 Days to End with You
            <br />
            {t('titleLine2')}
          </Typography>
          <Typography sx={{ textAlign: 'center' }}>
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
          <Grid container sx={{ justifyContent: 'space-around' }}>
            <Grid size={{ xs: 8.5, md: 9.5 }}>
              <TextField
                type="email"
                inputMode="email"
                value={inputText}
                slotProps={{
                  input: {
                    className: 'dtwey-font',
                    style: { fontSize: '30px' },
                  },
                }}
                label={t('inputLabel')}
                onChange={(event) => {
                  showAnalyzeText(event.target.value ?? '');
                }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 3, md: 2 }}>
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
          <Box sx={{ p: 3 }} />
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
          <AdUnit />
        </Stack>
      </Stack>
      <Footer />
    </>
  );
}
