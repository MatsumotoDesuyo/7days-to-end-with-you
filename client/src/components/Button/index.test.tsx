import React from 'react';
import renderer from 'react-test-renderer';
import Button from '.';

test('test test', () => {
  const component = renderer.create(<Button label="fuga" />);
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
