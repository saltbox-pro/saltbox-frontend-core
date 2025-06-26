import { observer } from "mobx-react-lite";
import { Flex } from "antd";
import { dashboardStore } from "saltbox-core/store";
import { MinionFilterStore } from "saltbox-core/store";
import { MinionDashboardCard } from "./minion-dashboard-card";
import styles from "./minions-dashboard-view.module.css";
import { MinionsQueryBuilder } from "./minions-query-builder";

export const MinionsDashboardView = observer(
  (props: {
    slug: string;
    filterStore: MinionFilterStore;
    showFilter: boolean;
  }) => {
    return (
      <Flex gap={8} vertical>
        {props.showFilter && (
          <MinionsQueryBuilder
            slug={props.slug}
            filterStore={props.filterStore}
          />
        )}

        <div className={styles.dashboardTablesContainer}>
          {dashboardStore.blocks.map((block, index) => (
            <div
              key={index}
              className={`${styles.dashboardTableBlock} ${styles[`dashboardTableBlock${index + 1}`]
                }`}
            >
              <MinionDashboardCard
                grains={block.grains}
                view={block.view}
                onUpdateGrains={(newGrains) =>
                  dashboardStore.updateGrains(index, newGrains)
                }
                onRemove={() => dashboardStore.removeBlock(index)}
                onChangeView={(newView) =>
                  dashboardStore.updateView(index, newView)
                }
                slug={props.slug}
                filterStore={props.filterStore}
              />
            </div>
          ))}
        </div>
      </Flex>
    );
  }
);
