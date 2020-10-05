import styled from 'styled-components';

export const ContextMenuStyled = styled.div`
  position: fixed;
  z-index: 999999;
  color: white;
  background-color: #2b2b2b;
  border: 1px solid #808080;
  padding: 5pt 2pt;
`;

export const ContextMenuItem = styled.div`
  padding: 5pt;
  display: flex;

  &:hover {
    background-color: rgba(0, 0, 0, 0.15);
  }

  img {
    height: 10pt;
    width: 10pt;
    padding-right: 5pt;
  }
`;

export const ContextColumn = styled.div`
  width: 100%;
`;

export const ContextSeparator = styled.div`
  width: 100%;
  height: 1px;
  margin: 2pt 0pt;
  background-color: #808080;
  border-bottom: 1 solid #808080;
`;

export const ContextEmptySpace = styled.div`
  height: 10pt;
  width: 10pt;
  padding-right: 5pt;
`;

export const ContextDisabled = styled.div`
  color: #616161;
  padding: 5pt;

  display: flex;

  &:hover {
    background-color: inherit;
  }

  img {
    filter: grayscale(100%);
  }

  svg {
    filter: grayscale(100%);
  }
`;

export const ContextIcon = styled.span`
  padding-right: 10px;
  font-size: 15px;
  img {
    width: 25px;
    height: 25px;
  }
`;
