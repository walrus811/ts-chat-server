import _ from "lodash";

export default function ValueCell<T>(initialValue: T)
{
  let currentValue = initialValue;
  let watchers = [] as ((newValue: T) => void)[];

  return {
    val: function ()
    {
      return currentValue;
    },
    update: function (f: (oldValue: T) => T)
    {
      let oldValue = currentValue;
      let newValue = f(oldValue);
      if (oldValue !== newValue)
      {
        currentValue = newValue;
        _.forEach(watchers, (watcher) => watcher(newValue));
      }
    },
    addWatcher: function (f: (newValue: T) => void)
    {
      watchers.push(f);
    },
  };
}