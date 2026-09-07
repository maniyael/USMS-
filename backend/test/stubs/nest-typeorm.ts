export class Repository<T = unknown> {
  // Minimal structural stand-in used by unit tests only.
  findOneBy(): Promise<T | null> {
    return Promise.resolve(null);
  }
  find(): Promise<T[]> {
    return Promise.resolve([]);
  }
  createQueryBuilder() {
    return {
      select: () => {
        throw new Error('createQueryBuilder not mocked');
      },
    };
  }
}

export class DataSource {
  // Stand-in; not exercised by unit tests.
}

export function InjectRepository(_entity: unknown): PropertyDecorator {
  return (_target, _propertyKey) => {};
}

export function InjectDataSource(_name?: unknown): PropertyDecorator {
  return (_target, _propertyKey) => {};
}

export const TypeOrmModule = {
  forFeature: () => ({}),
  forRoot: () => ({}),
  forRootAsync: () => ({}),
};