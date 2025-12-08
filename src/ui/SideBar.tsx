import { Card, Divider, Input } from "antd";
import Header from "./Header";
import FileList from "./FileList";
import type { SearchProps } from "antd/es/input";
import { useObservable } from "../utils/UseObservable";
import { isSearching, searchQuery } from "../logic/Search";
import SearchResults from "./SearchResults";
import { isThin } from "../logic/Browser";
import { classesList } from "../logic/JarFile.ts";
import { openTab } from "../logic/Tabs.ts";

const { Search } = Input;

const SideBar = () => {
    const isSmall = useObservable(isThin);
    const classes = useObservable(classesList);

    const onChange: SearchProps['onChange'] = (e) => {
        searchQuery.next(e.target.value);
    };

    const findExactMatch: SearchProps['onPressEnter'] = (e) => {
        if (!classes) return;
        const query = (e.target as HTMLInputElement).value.toLowerCase() + ".class";
        for (const className of classes) {
            if (className.slice(className.lastIndexOf("/") + 1).toLowerCase() === query) openTab(className);
        }
    }

    return (
        <Card cover={isSmall ? undefined : <Header />} variant="borderless">
            <Search placeholder="Search classes" allowClear onChange={onChange} onPressEnter={findExactMatch}></Search>
            <Divider size="small" />
            <FileListOrSearchResults />
        </Card>
    );
};

const FileListOrSearchResults = () => {
    const showSearchResults = useObservable(isSearching);
    if (showSearchResults) {
        return <SearchResults />;
    } else {
        return <FileList />;
    }
};

export default SideBar;
