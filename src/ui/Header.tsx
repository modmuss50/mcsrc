import { Button } from "antd"
import { downloadMinecraftJar } from "../logic/MinecraftApi";

const Header = () => {
    return (
        <Button type="primary" onClick={() => downloadMinecraftJar()}>
            Load
        </Button>
    )
};

export default Header;