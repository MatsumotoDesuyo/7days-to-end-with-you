import React from 'react';
import renderer from 'react-test-renderer';
import { JsxModule } from '.';

test('test test', () => {
  const component = renderer.create(<JsxModule />);
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
