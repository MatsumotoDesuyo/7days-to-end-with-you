import React from 'react';
import { Button, Grid, Avatar } from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';

type Props = {
  onInputButtonPushedFunc: (c: string) => void;
  onDeleteButtonPushedFunc: () => void;
};
const alphabets: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');
export default function ImageKeyboard(props: Props) {
  return (
    <Grid container columnSpacing={0.5} rowSpacing={0.5}>
      {alphabets.map((c) => (
        <Grid item xs={4} md={1.3333}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Avatar variant="square" src={`/images/${c}.png`} />}
            onClick={() => {
              props.onInputButtonPushedFunc(c.toUpperCase());
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
            props.onDeleteButtonPushedFunc();
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
  );
}
