import React from "react";
import { useTranslation } from "react-i18next";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import DemoSection from "./common/DemoSection";

export default function TreeDemo() {
    const { t } = useTranslation();
    return (
        <DemoSection title={t('tree')} icon={AccountTreeOutlined} color="#009688">
            <SimpleTreeView defaultExpandedItems={['1', '2']}>
                <TreeItem itemId="1" label={t('documents') as string}>
                    <TreeItem itemId="1.1" label="report-2024.pdf" />
                    <TreeItem itemId="1.2" label="invoice.docx" />
                </TreeItem>
                <TreeItem itemId="2" label={t('projects') as string}>
                    <TreeItem itemId="2.1" label="base-ui" />
                    <TreeItem itemId="2.2" label={t('mobile-app') as string}>
                        <TreeItem itemId="2.2.1" label="ios" />
                        <TreeItem itemId="2.2.2" label="android" />
                    </TreeItem>
                </TreeItem>
                <TreeItem itemId="3" label={t('pictures') as string} />
            </SimpleTreeView>
        </DemoSection>
    );
}
