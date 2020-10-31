import styled from "styled-components";

export const WarperIDE = styled.div`
  overflow: hidden;
  height: 100%;
  width: 100%;
  background-color: #282a36;
  color: white !important;
  display: flex;
  flex-flow: column;
`;

export const ToolBar = styled.div`
  width: 100%;
  border-bottom: 1px solid #00010a;
  outline: none;
`;

export const IDEContent = styled.div`
  display: flex;
  height: 100%;
`;

export const TextareaIDE = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin-top: 1px;
  border-top: 1px solid #00010a;
`;
export const EditorArea = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column;
  * {
    font-family: monospace, "Courier New", Courier;
  }
`;

export const ButtonIDE = styled.button`
  background-color: gray;
  color: white;
  border: 1px solid white;
  outline: none;
`;

export const TabActive = styled.span`
  border-bottom: 1px solid #f1fa8c;
  cursor: pointer;
  margin: 5px;
`;
export const Tab = styled.span`
  cursor: pointer;
  margin: 5px;
`;

export const Tabs = styled.div`
  overflow-x: none;
  overflow-y: h;
`;

export const FileExplorer = styled.div`
  height: 100%;
  width: 200px;
  cursor: pointer;
  border-right: 1px solid #00010a;
`;

export const FileExplorerLabel = styled.div``;

export const FileExplorerButton = styled.div`
  display: inline;
  float: right;
  border: none;
  background-color: transparent;
  color: gray;
  margin: 0 2px;
  &:hover {
    color: white;
  }
`;

export const FileExplorerContent = styled.div``;

export const FolderOrFile = styled.div``;

export const ToolBarButton = styled.button`
  border: none;
  background-color: transparent;
  color: gray;
  &:hover {
    color: white;
  }
`;
