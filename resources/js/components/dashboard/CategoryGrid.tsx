import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    desc: string;
    image: string;
}

interface CategoryGridProps {
    categories: Category[];
    categoryCounts: Record<string, number>;
}

export default function CategoryGrid({ categories, categoryCounts }: CategoryGridProps) {
    const { t } = useTranslation();

    return (
        <div>
            <h2 className="mb-6 mt-6 flex items-center text-2xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('Explore Categories')}</span>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/quiz/category/${cat.id}`}
                        className="group relative flex min-h-[180px] sm:min-h-[220px] transform cursor-pointer flex-col justify-end overflow-hidden rounded-[2rem] border border-slate-200/50 sm:p-6 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/50"
                    >
                        {/* Card Background */}
                        <div className="absolute inset-0">
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90 transition-opacity group-hover:opacity-80"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div
                                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/10`}
                                >
                                    {cat.icon}
                                </div>
                                <div className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm opacity-0 transform translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>

                            <h3 className="mb-1 text-2xl font-black text-white tracking-tight transition-colors group-hover:text-blue-300">{t(cat.name)}</h3>
                            <p className="mb-4 line-clamp-2 text-sm font-medium leading-relaxed text-slate-300">{t(cat.desc)}</p>

                            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                                <span>
                                    {categoryCounts[cat.name] || 0} {t('Questions')}
                                </span>
                                <span className="text-white group-hover:text-blue-400 transition-colors">
                                    {t('Start')}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
