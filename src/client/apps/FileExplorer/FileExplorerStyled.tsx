import styled from 'styled-components';

export const FileExplorerWarper = styled.div`
  width: 100%;
  height: 100%;
  background-color: #191919;
  display: flex;
  flex-direction: column;

  position: relative;
  overflow: hidden;
`;

export const FileExplorerUrlBar = styled.div`
  width: 100%;
  background-color: #202020;
  padding: 5px;
  margin: 5px;
`;

export const FileExplorerContent = styled.div`
  display: flex;
  flex-direction: row;
  background-color: black;

  width: 100%;
  height: 100%;
`;

export const FileExplorerList = styled.div`
  width: 100px;
  background-color: #191919;
`;

export const FileExplorerContents = styled.div`
  width: 100%;
  height: 100%;
  background-color: #202020;
  border-left: 1px solid #2b2b2b;
`;

export const FileExploreBottom = styled.div`
  width: 100%;
  background-color: #454545;
`;

const textWarp = `
flex: auto;
width: auto;
display: inline-block;
white-space: nowrap;
overflow: hidden !important;
text-overflow: ellipsis;
`;

export const FileExplorerFileOrDirectory = styled.div`
  margin: 2px;
  display: flex;
  flex-direction: row;

  span {
    ${textWarp}
  }
  input {
    ${textWarp}
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
`;
