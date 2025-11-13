import { useObservable } from "../utils/UseObservable"
import { selectedFile } from "../logic/State"
import { Button, theme } from "antd";
import { TabsComponent } from "./tabs/TabsComponent";
import { MenuFoldOutlined } from '@ant-design/icons';

export const CodeHeader = ({ showDrawer }: { showDrawer?: () => void }) => {
    const { token } = theme.useToken();
    const info = useObservable(selectedFile);

    return info ? (
        <>
            <div style={{
                display: "flex",
                alignItems: "center"
            }}>
                {showDrawer &&
                    <Button
                        size="large"
                        type="primary"
                        onClick={() => showDrawer?.()}
                        icon={<MenuFoldOutlined />}
                        style={{
                            flexShrink: 0,
                            margin: ".5rem .5rem .5rem 1.5rem"
                        }}
                    />
                }
                <div style={{ overflowX: "auto" }}><TabsComponent /></div>
            </div>
            <div style={{
                display: "flex",
                width: "100%",
                boxSizing: "border-box",
                alignItems: "center",
                justifyContent: "left",
                padding: ".5rem 1rem",
                fontFamily: token.fontFamily
            }}>
                <div style={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    direction: "rtl",
                    color: "white"
                }}>
                    {info.replace(".class", "").split("/").map((path, i, arr) => (
                        <>
                            <span style={{ color: i < arr.length - 1 ? "gray" : "white" }}>{path}</span>
                            {i < arr.length - 1 && <span style={{ color: "gray" }}>/</span>}
                        </>
                    ))}
                </div>
            </div>
        </>
    ) : null
}