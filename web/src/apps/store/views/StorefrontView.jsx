import { useMemo, useState } from 'react';
import { ShoppingBag, UserRound } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { ButtonRow, ButtonRowLabel } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { EmptyState } from '../../../shared/EmptyState';
import { useStoreOptional } from '../StoreContext';
import { StoreItemCard } from '../components/StoreItemCard';
import { RedeemModal } from '../components/RedeemModal';
import {
  getStorefrontItems,
} from '../../../data/store/storeStorage';
import { readStoreSettings } from '../../../data/store/storeSettings';
import { redeemStoreItem } from '../../../data/store/redeem';
import { useClasses } from '../../../data/classes/ClassContext';

/**
 * Class storefront — manage listings (Store app) or redeem (Bank/Behavior embed).
 * @param {'manage'|'redeem'} mode
 */
export function StorefrontView({
  isDarkMode,
  theme,
  classLabel,
  mode = 'manage',
  // Embed props when outside StoreProvider
  classId: classIdProp,
  roster: rosterProp,
}) {
  const store = useStoreOptional();
  const { selectedClass } = useClasses();
  const classId = store?.classId || classIdProp || selectedClass?.id;
  const roster = store?.roster || rosterProp || selectedClass?.studentList || [];
  const settings = store?.settings || readStoreSettings();

  const items = useMemo(() => {
    if (store?.storefrontItems) return store.storefrontItems;
    return getStorefrontItems(classId);
  }, [store?.storefrontItems, classId]);

  const [redeemItem, setRedeemItem] = useState(null);
  const [redeemMode, setRedeemMode] = useState('teacher');

  const doRedeem = (args) => {
    if (store?.redeem) return store.redeem(args);
    return redeemStoreItem({ classId, roster, ...args });
  };

  const removeFromFront = (itemId) => {
    store?.removeFromClassStorefront?.(itemId);
  };

  const connected =
    (settings.connectBank || settings.connectBehavior) &&
    (mode === 'manage' ||
      (settings.connectBank && mode === 'redeem') ||
      (settings.connectBehavior && mode === 'redeem'));

  // For embeds, parent only mounts when connected; still guard.
  if (mode === 'redeem' && !settings.connectBank && !settings.connectBehavior) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Store"
          description="Connect Edu.Store to this app in Settings."
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Storefront"
        description={
          classLabel
            ? `${classLabel} · ${
                mode === 'manage'
                  ? 'Class prizes students can redeem'
                  : 'Redeem rewards'
              }`
            : 'Class prizes'
        }
        isDarkMode={isDarkMode}
      />

      {mode === 'redeem' && settings.studentSelfServe ? (
        <ButtonRow>
          <button
            type="button"
            className={toolBtnClass(isDarkMode)}
            title="Self-serve mode uses student PIN"
            aria-label="Self-serve hint"
            disabled
          >
            <UserRound size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Self-serve on</ButtonRowLabel>
          </button>
        </ButtonRow>
      ) : null}

      {!connected && mode === 'manage' ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Tip: turn on Connect to Bank / Behavior in Store Settings so redeem
          appears inside those apps.
        </p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            mode === 'manage'
              ? 'This class storefront is empty. Add items from Catalog.'
              : 'No store items for this class yet.'
          }
          illustration={<ShoppingBag size={36} className="text-slate-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <StoreItemCard
              key={item.id}
              item={item}
              theme={theme}
              isDarkMode={isDarkMode}
              classId={classId}
              actions={
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`edu-control rounded-lg px-2.5 py-1 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRedeemMode('teacher');
                      setRedeemItem(item);
                    }}
                  >
                    Redeem
                  </button>
                  {mode === 'redeem' && settings.studentSelfServe ? (
                    <button
                      type="button"
                      className={`edu-control rounded-lg px-2.5 py-1 ${TYPE.labelMd} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRedeemMode('selfServe');
                        setRedeemItem(item);
                      }}
                    >
                      Self-serve
                    </button>
                  ) : null}
                  {mode === 'manage' ? (
                    <button
                      type="button"
                      className={`edu-control rounded-lg px-2.5 py-1 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromFront(item.id);
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      )}

      <RedeemModal
        isOpen={Boolean(redeemItem)}
        item={redeemItem}
        roster={roster}
        classId={classId}
        theme={theme}
        isDarkMode={isDarkMode}
        settings={settings}
        mode={redeemMode}
        onClose={() => setRedeemItem(null)}
        onRedeem={doRedeem}
      />
    </div>
  );
}
