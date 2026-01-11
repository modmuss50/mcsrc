import LoginModal from "../javadoc/api/LoginModal";
import JavadocModal from "../javadoc/JavadocModal";
import IndexProgressModal from "./IndexProgressModal";
import InheritanceModal from "./inheritance/InheritanceModal";
import ProgressModal from "./ProgressModal";
import AboutModal from "./AboutModal";
import SettingsModal from "./SettingsModal";

const Modals = () => {
    return (
        <>
            <ProgressModal />
            <IndexProgressModal />
            <JavadocModal />
            <LoginModal />
            <InheritanceModal />
            <AboutModal />
            <SettingsModal />
        </>
    );
};

export default Modals;