import { Select } from "antd"
import { minecraftVersions } from "../logic/MinecraftApi";
import { useObservable } from "../utils/UseObservable";

const Header = () => {
    const versions = useObservable(minecraftVersions)

    return (
        <Select value={versions?.[0]} style={{ width: 120, marginRight: 16 }}>
            {versions?.map(v => (
                <Select.Option key={v} value={v}>{v}</Select.Option>
            ))}
        </Select>
    )
};

export default Header;