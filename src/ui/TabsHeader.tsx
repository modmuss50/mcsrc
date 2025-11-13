import { Button } from "antd";
import { TabsComponent } from "./tabs/TabsComponent";
import { MenuFoldOutlined } from '@ant-design/icons';

export const TabsHeader = ({ showDrawer }: { showDrawer?: () => void }) => {
    return (
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
    )
}